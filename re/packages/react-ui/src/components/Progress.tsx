import React from 'react';
import { ProgressComponent } from '@re/core';

export function Progress({ props }: { props: ProgressComponent['props'] }) {
  const { value, max = 100, label, showPercentage } = props;
  const percentage = Math.round((value / max) * 100);

  return (
    <div>
      {(label || showPercentage) && (
        <div className="re-progress-label">
          {label && <span>{label}</span>}
          {showPercentage && <span>{percentage}%</span>}
        </div>
      )}
      <div className="re-progress">
        <div className="re-progress-bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
