import React from 'react';
import clsx from 'clsx';
import { ContainerComponent } from '@re/core';
import { ComponentRenderer } from '../renderer';

export interface ContainerProps {
  component: ContainerComponent;
  onAction?: (actionId: string) => void;
}

export function Container({ component, onAction }: ContainerProps) {
  const { props, children = [] } = component;
  const { direction = 'column', gap = 'md', align = 'start' } = props || {};

  return (
    <div
      className={clsx(
        `re-container-${direction}`,
        `re-container-gap-${gap}`,
        `re-container-align-${align}`
      )}
    >
      {children.map((child) => (
        <ComponentRenderer key={child.id} component={child} onAction={onAction} />
      ))}
    </div>
  );
}
