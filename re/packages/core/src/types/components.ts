// Component type definitions for Re Generative UI

export type ComponentType =
  | 'text'
  | 'heading'
  | 'button'
  | 'card'
  | 'list'
  | 'table'
  | 'chart'
  | 'form'
  | 'input'
  | 'select'
  | 'image'
  | 'alert'
  | 'progress'
  | 'badge'
  | 'divider'
  | 'container';

export interface BaseComponent {
  id: string;
  type: ComponentType;
  props?: Record<string, any>;
  children?: Component[];
}

export interface TextComponent extends BaseComponent {
  type: 'text';
  props: {
    content: string;
    size?: 'sm' | 'md' | 'lg';
    weight?: 'normal' | 'medium' | 'bold';
    color?: string;
  };
}

export interface HeadingComponent extends BaseComponent {
  type: 'heading';
  props: {
    content: string;
    level?: 1 | 2 | 3 | 4 | 5 | 6;
  };
}

export interface ButtonComponent extends BaseComponent {
  type: 'button';
  props: {
    label: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    onClick?: string; // Action identifier
    disabled?: boolean;
  };
}

export interface CardComponent extends BaseComponent {
  type: 'card';
  props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'outline' | 'filled';
  };
  children: Component[];
}

export interface ListComponent extends BaseComponent {
  type: 'list';
  props: {
    items: Array<{
      id: string;
      label: string;
      description?: string;
      icon?: string;
    }>;
    variant?: 'bullet' | 'numbered' | 'none';
  };
}

export interface TableComponent extends BaseComponent {
  type: 'table';
  props: {
    headers: string[];
    rows: Array<Record<string, any>>;
    sortable?: boolean;
    striped?: boolean;
  };
}

export interface ChartComponent extends BaseComponent {
  type: 'chart';
  props: {
    chartType: 'line' | 'bar' | 'pie' | 'area';
    data: Array<Record<string, any>>;
    xKey: string;
    yKey: string;
    title?: string;
  };
}

export interface FormComponent extends BaseComponent {
  type: 'form';
  props: {
    title?: string;
    submitLabel?: string;
    onSubmit?: string; // Action identifier
  };
  children: Component[];
}

export interface InputComponent extends BaseComponent {
  type: 'input';
  props: {
    name: string;
    label: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel';
    required?: boolean;
    defaultValue?: string;
  };
}

export interface SelectComponent extends BaseComponent {
  type: 'select';
  props: {
    name: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    required?: boolean;
    defaultValue?: string;
  };
}

export interface ImageComponent extends BaseComponent {
  type: 'image';
  props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    rounded?: boolean;
  };
}

export interface AlertComponent extends BaseComponent {
  type: 'alert';
  props: {
    title?: string;
    message: string;
    variant: 'info' | 'success' | 'warning' | 'error';
    dismissible?: boolean;
  };
}

export interface ProgressComponent extends BaseComponent {
  type: 'progress';
  props: {
    value: number;
    max?: number;
    label?: string;
    showPercentage?: boolean;
  };
}

export interface BadgeComponent extends BaseComponent {
  type: 'badge';
  props: {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  };
}

export interface DividerComponent extends BaseComponent {
  type: 'divider';
  props?: {
    label?: string;
  };
}

export interface ContainerComponent extends BaseComponent {
  type: 'container';
  props?: {
    direction?: 'row' | 'column';
    gap?: 'sm' | 'md' | 'lg';
    align?: 'start' | 'center' | 'end';
  };
  children: Component[];
}

export type Component =
  | TextComponent
  | HeadingComponent
  | ButtonComponent
  | CardComponent
  | ListComponent
  | TableComponent
  | ChartComponent
  | FormComponent
  | InputComponent
  | SelectComponent
  | ImageComponent
  | AlertComponent
  | ProgressComponent
  | BadgeComponent
  | DividerComponent
  | ContainerComponent;

export interface GeneratedUI {
  components: Component[];
  metadata?: {
    title?: string;
    description?: string;
  };
}
