import React from 'react';
import clsx from 'clsx';
import { ListComponent } from '@re/core';

export function List({ props }: { props: ListComponent['props'] }) {
  const { items, variant = 'none' } = props;

  const className = clsx(
    're-list',
    variant === 'bullet' && 're-list-bullet',
    variant === 'numbered' && 're-list-numbered'
  );

  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.id} className="re-list-item">
          <span className="re-list-item-label">{item.label}</span>
          {item.description && (
            <span className="re-list-item-description">{item.description}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
