import { storiesOf } from '@storybook/react';
import * as React from 'react';

import LongviewLineGraph from './LongviewLineGraph';

const Example: React.FC<{}> = props => {
  return (
    <React.Fragment>
      <LongviewLineGraph title="Hello" subtitle="world" />
    </React.Fragment>
  );
};

storiesOf('Longview Line Graph', module).add('Example', () => <Example />);
