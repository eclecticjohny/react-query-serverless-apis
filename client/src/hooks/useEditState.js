import { useState } from "react";

export const UseEditState = (initialState = false) => {
  const [isEdit, setIsEdit] = useState(false);

  const toggle = () => setIsEdit((isedit) => !isedit);

  return [isEdit, toggle];
};
