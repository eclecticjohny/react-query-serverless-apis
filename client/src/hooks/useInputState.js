import { useState } from "react";

export const UseInputState = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  const onChangeHandler = (e) => setValue(e.target.value);
  const reset = (e) => setValue("");

  return [value, onChangeHandler, reset];
};
