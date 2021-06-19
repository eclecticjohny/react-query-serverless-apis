import React from "react";
import { UseEditState as useEditState } from "../hooks/useEditState";
import { TiEdit, TiDelete } from "react-icons/ti";
import { useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { request, gql } from "graphql-request";
import { graphqlUrl } from "../api";
import { EditTodoForm } from "./EditTodoForm";

const Todo = ({ todo, apiUrl }) => {
  const [isEdit, toggle] = useEditState(false);
  const queryClient = useQueryClient();

  const deleteTodo = async () => {
    if (apiUrl === graphqlUrl) {
      const {
        delete: { body },
      } = await request(
        apiUrl,
        gql`
        mutation {
          delete(id: "${todo.id}"){
            statusCode,
            body
          }
        }
        `
      );
      return body;
    } else {
      return axios.delete(`${apiUrl}/${todo.id}`);
    }
  };

  const { mutate: mutateDelete } = useMutation(() => deleteTodo(), {
    onSettled: () => {
      queryClient.refetchQueries(["tasks", apiUrl]);
    },
  });

  const updateCompletion = async () => {
    if (apiUrl === graphqlUrl) {
      const {
        update: { body },
      } = await request(
        apiUrl,
        gql`
        mutation {
          update(id: "${todo.id}", task: "${
          todo.task
        }", completed: ${!todo.completed}){
            statusCode,
            body
          }
        }
        `
      );
      return body;
    } else {
      return axios.put(`${apiUrl}/${todo.id}`, {
        task: todo.task,
        completed: !todo.completed,
      });
    }
  };

  const { mutate: mutateToggle } = useMutation(() => updateCompletion(), {
    onSettled: () => {
      queryClient.refetchQueries(["tasks", apiUrl]);
    },
  });
  return (
    <li className="listItem">
      {isEdit ? (
        <EditTodoForm toggle={toggle} todo={todo} apiUrl={apiUrl} />
      ) : (
        <div className="round">
          <input
            type="checkbox"
            id={`checkbox ${todo.id}`}
            checked={todo.completed || ""}
            onChange={() => mutateToggle()}
          />
          <label htmlFor={`checkbox ${todo.id}`}></label>

          <div className="update-delete">
            <div
              className={`todo__task ${todo.completed ? "done" : "notDone"}`}
            >
              {todo.task}
            </div>

            <div className="icon icon-edit" onClick={toggle}>
              <TiEdit />
            </div>

            <div className="icon icon-delete" onClick={() => mutateDelete()}>
              <TiDelete />
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export default Todo;
