import React from 'react';
import { DividerComponent } from '@re/core';

export function Divider({ props }: { props?: DividerComponent['props'] }) {
  const { label } = props || {};

  if (label) {
    return (
      <div className="re-divider-label">
        <span>{label}</span>
      </div>
    );
  }

  return <hr className="re-divider" />;
}
