"""Data query functions for computing aggregations from retention data."""

import pandas as pd
from pathlib import Path
from typing import Any
from loguru import logger

# Global data cache
_data_cache: pd.DataFrame | None = None


def get_data() -> pd.DataFrame:
    """Load and cache retention customer data."""
    global _data_cache
    
    if _data_cache is not None:
        return _data_cache
    
    # Try multiple possible paths
    possible_paths = [
        Path(__file__).parent.parent.parent.parent / "data" / "retention_customers.csv",
        Path("data/retention_customers.csv"),
        Path("../data/retention_customers.csv"),
        Path("nitiai/data/retention_customers.csv"),
    ]
    
    for path in possible_paths:
        if path.exists():
            logger.info(f"Loading data from: {path}")
            _data_cache = pd.read_csv(path)
            logger.info(f"Loaded {len(_data_cache)} rows with columns: {list(_data_cache.columns)}")
            return _data_cache
    
    logger.warning("Could not find retention_customers.csv")
    return pd.DataFrame()


def compute_data_context(query: str) -> str:
    """Compute relevant data aggregations based on the query.
    
    This function analyzes the query and computes actual data aggregations
    to inject into the LLM context, preventing hallucination.
    
    Args:
        query: User's query string
        
    Returns:
        Context string with computed data to inject into LLM prompt
    """
    df = get_data()
    if df.empty:
        return ""
    
    query_lower = query.lower()
    context_parts = []
    
    # Always include basic stats
    total_customers = len(df)
    churn_rate = df['churn_flag'].mean()
    churned = int(df['churn_flag'].sum())
    retained = total_customers - churned
    
    context_parts.append(f"""
=== ACTUAL DATA FROM retention_customers.csv ===
Total customers: {total_customers}
Overall churn rate: {churn_rate:.1%}
Churned customers: {churned}
Retained customers: {retained}
""")
    
    # Channel-related query
    if any(word in query_lower for word in ['channel', 'acquisition', 'google', 'meta', 'referral', 'organic', 'influencer']):
        channel_stats = df.groupby('acquisition_channel').agg({
            'customer_id': 'count',
            'churn_flag': 'mean'
        }).rename(columns={'customer_id': 'count', 'churn_flag': 'churn_rate'})
        channel_stats = channel_stats.sort_values('churn_rate', ascending=False)
        
        context_parts.append(f"""
Customers and churn by acquisition channel:
{channel_stats.to_string()}

Highest churn: {channel_stats['churn_rate'].idxmax()} ({channel_stats['churn_rate'].max():.1%})
Lowest churn: {channel_stats['churn_rate'].idxmin()} ({channel_stats['churn_rate'].min():.1%})
Most customers: {channel_stats['count'].idxmax()} ({channel_stats['count'].max()} customers)
""")
    
    # Region-related query
    if any(word in query_lower for word in ['region', 'country', 'uk', 'us', 'au', 'ca', 'india', 'in', 'location']):
        region_stats = df.groupby('region').agg({
            'customer_id': 'count',
            'churn_flag': 'mean'
        }).rename(columns={'customer_id': 'count', 'churn_flag': 'churn_rate'})
        region_stats = region_stats.sort_values('count', ascending=False)
        
        context_parts.append(f"""
Customers and churn by region:
{region_stats.to_string()}
""")
    
    # Brand-related query
    if any(word in query_lower for word in ['brand', 'brands']):
        brand_count = df['brand_id'].nunique()
        brand_list = df['brand_id'].unique().tolist()
        
        context_parts.append(f"""
Number of brands: {brand_count}
Brands: {', '.join(map(str, brand_list))}
""")
    
    # Churn/retention specific
    if any(word in query_lower for word in ['churn', 'retain', 'retention', 'lost', 'kept']):
        # Already included in basic stats above
        pass
    
    context = "\n".join(context_parts)
    
    if context.strip():
        context += "\n=== END ACTUAL DATA ===\n\nIMPORTANT: Use ONLY the data above. Do NOT make up numbers."
    
    return context


def query_data(
    operation: str,
    column: str | None = None,
    group_by: str | None = None,
    filter_column: str | None = None,
    filter_value: Any = None,
) -> dict[str, Any]:
    """Execute a data query operation.
    
    Args:
        operation: One of 'count', 'mean', 'sum', 'unique', 'value_counts'
        column: Column to operate on
        group_by: Optional column to group by
        filter_column: Optional column to filter on
        filter_value: Value to filter by
        
    Returns:
        Dictionary with query results
    """
    df = get_data()
    if df.empty:
        return {"error": "No data available"}
    
    # Apply filter if specified
    if filter_column and filter_value is not None:
        df = df[df[filter_column] == filter_value]
    
    result: dict[str, Any] = {"operation": operation, "rows": len(df)}
    
    if group_by:
        if operation == 'count':
            grouped = df.groupby(group_by).size()
        elif operation == 'mean' and column:
            grouped = df.groupby(group_by)[column].mean()
        elif operation == 'sum' and column:
            grouped = df.groupby(group_by)[column].sum()
        else:
            return {"error": f"Unsupported operation: {operation}"}
        
        result["data"] = grouped.to_dict()
    else:
        if operation == 'count':
            result["value"] = len(df)
        elif operation == 'mean' and column:
            result["value"] = df[column].mean()
        elif operation == 'sum' and column:
            result["value"] = df[column].sum()
        elif operation == 'unique' and column:
            result["value"] = df[column].nunique()
            result["values"] = df[column].unique().tolist()
        elif operation == 'value_counts' and column:
            result["data"] = df[column].value_counts().to_dict()
        else:
            return {"error": f"Unsupported operation: {operation}"}
    
    return result
