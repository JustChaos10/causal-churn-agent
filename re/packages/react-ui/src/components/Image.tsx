import React from 'react';
import clsx from 'clsx';
import { ImageComponent } from '@re/core';

export function Image({ props }: { props: ImageComponent['props'] }) {
  const { src, alt, width, height, rounded } = props;

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={clsx('re-image', rounded && 're-image-rounded')}
    />
  );
}
