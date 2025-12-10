import React from 'react';
import clsx from 'clsx';
import { CardComponent } from '@re/core';
import { ComponentRenderer } from '../renderer';

export interface CardProps {
  component: CardComponent;
  onAction?: (actionId: string) => void;
}

export function Card({ component, onAction }: CardProps) {
  const { props, children = [] } = component;
  const { title, description, variant = 'default' } = props || {};

  return (
    <div className={clsx('re-card', `re-card-${variant}`)}>
      {title && <h3 className="re-card-title">{title}</h3>}
      {description && <p className="re-card-description">{description}</p>}
      {children.length > 0 && (
        <div>
          {children.map((child) => (
            <ComponentRenderer key={child.id} component={child} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
}
