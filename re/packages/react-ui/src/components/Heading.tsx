import React from 'react';
import clsx from 'clsx';
import { HeadingComponent } from '@re/core';

export function Heading({ props }: { props: HeadingComponent['props'] }) {
  const { content, level = 2 } = props;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return <Tag className={clsx('re-heading', `re-heading-${level}`)}>{content}</Tag>;
}
