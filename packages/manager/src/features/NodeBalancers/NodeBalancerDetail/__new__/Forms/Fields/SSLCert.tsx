import * as React from 'react';
import TextField, { Props } from 'src/components/TextField';

type CombinedProps = Props;

const SSLCertField: React.FC<CombinedProps> = props => {
  return (
    <TextField
      {...props}
      multiline
      rows={3}
      label="SSL Certificate"
      required
      data-qa-cert-field
      small
    />
  );
};

export default React.memo(SSLCertField, (prevProps, newProps) => {
  return (
    prevProps.value === newProps.value &&
    prevProps.errorText === newProps.errorText &&
    prevProps.disabled === newProps.disabled
  );
});
