import React from 'react';
import clsx from 'clsx';
import { AlertComponent } from '@re/core';

export function Alert({ props }: { props: AlertComponent['props'] }) {
  const { title, message, variant } = props;

  return (
    <div className={clsx('re-alert', `re-alert-${variant}`)}>
      {title && <div className="re-alert-title">{title}</div>}
      <div className="re-alert-message">{message}</div>
    </div>
  );
}
