import React from "react";
import { apiUrlsStrings } from "../api";

export const RadioSelect = ({ apiUrl, setApiUrl }) => (
  <div className="mx-auto max-w-lg text-center flex flex-wrap justify-center">
    {apiUrlsStrings.map((apiUrlString, index) => (
      <div
        key={apiUrlString.name + index}
        className="flex items-center mr-4 mb-4"
      >
        <input
          id={`radio${index}`}
          type="radio"
          name="radio"
          className="hidden"
          checked={apiUrl === apiUrlString.url}
          readOnly
        />
        <label
          htmlFor={`radio${index}`}
          className="flex items-center cursor-pointer"
          onClick={() => {
            setApiUrl(apiUrlString.url);
          }}
        >
          <span className="w-4 h-4 inline-block mr-1 border border-grey"></span>
          {apiUrlString.name}
        </label>
      </div>
    ))}
  </div>
);
