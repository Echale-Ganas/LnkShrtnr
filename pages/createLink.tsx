import React from "react";
import FullContainer from "./templates/fullContainer";
import PageContainer from "./templates/pageContainer";

import { GrFormPrevious } from "react-icons/gr";

function CreateLink() {
  return (
    <FullContainer title="Create Link">
      <PageContainer>
        <a href="/admin">
          <button type="button">
            <GrFormPrevious color="" />
          </button>
        </a>
        <h2>Create a new shortcut</h2>
        <form action="/create" method="POST">
          <input
            id="shortPath"
            name="shortPath"
            placeholder="Short path"
            type="text"
          />
          <input
            id="longPath"
            name="longPath"
            placeholder="Long path"
            type="text"
          />
          <input
            id="title"
            name="title"
            placeholder="Landing page title"
            type="text"
          />
          <input type="submit" id="submit" value="Submit" />
        </form>
      </PageContainer>
    </FullContainer>
  );
}

export default CreateLink;
