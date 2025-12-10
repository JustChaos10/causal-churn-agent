import React from 'react';
import clsx from 'clsx';
import { BadgeComponent } from '@re/core';

export function Badge({ props }: { props: BadgeComponent['props'] }) {
  const { label, variant = 'default' } = props;

  return <span className={clsx('re-badge', `re-badge-${variant}`)}>{label}</span>;
}
