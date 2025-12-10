import React from 'react';
import clsx from 'clsx';
import { TextComponent } from '@re/core';

export function Text({ props }: { props: TextComponent['props'] }) {
  const { content, size = 'md', weight = 'normal', color } = props;

  return (
    <p
      className={clsx('re-text', `re-text-${size}`, `re-text-${weight}`)}
      style={color ? { color } : undefined}
    >
      {content}
    </p>
  );
}
