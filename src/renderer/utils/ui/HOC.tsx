/**
 * @license
 * Copyright 2026 Ferrox Labs
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PropsWithChildren } from 'react';
import React from 'react';

const HOC = <HOCProps extends {}>(
  HOCComponent: React.FC<PropsWithChildren<HOCProps>>,
  hocProps?: Partial<HOCProps>
) => {
  return <Props extends Record<string, any>>(Component: React.FC<Props>): React.FC<Props> => {
    return (props: Props) => (
      <HOCComponent {...props} {...(hocProps || ({} as any))}>
        <Component {...props} />
      </HOCComponent>
    );
  };
};

const Create = <HOCProps extends {}>(
  HOCComponent: React.FC<HOCProps>,
  hocProps?: Partial<HOCProps>
): React.FC<HOCProps> => {
  return (props: HOCProps) => {
    return <HOCComponent {...(hocProps || {})} {...props} />;
  };
};

type HOCComponentAndProps<Props extends Record<string, any> = Record<string, any>> = [React.FC<Props>, Partial<Props>];

const Hook = (...hooks: Array<() => void>) => {
  return HOC.Create((props: any) => {
    hooks.forEach((hook) => hook());
    return <>{props.children}</>;
  });
};

// Apply HOCs to the original component from right to left
const Wrapper = (...HOCComponents: Array<React.FC<any> | HOCComponentAndProps>) => {
  return <Props extends Record<string, any>>(Component: React.FC<Props>): React.FC<Props> => {
    // Explicit cast to fix type errors caused by inconsistent reduce types
    return HOCComponents.toReversed().reduce<React.FC<Props>>((Com, HOCComponent) => {
      if (Array.isArray(HOCComponent)) {
        // Cast to ensure what we pass to HOC is a React.FC<Props>
        return HOC(HOCComponent[0] as React.FC<any>, HOCComponent[1])(Com);
      }
      return HOC(HOCComponent as React.FC<any>)(Com);
    }, Component);
  };
};

HOC.Wrapper = Wrapper;

HOC.Create = Create;

HOC.Hook = Hook;

export default HOC;
