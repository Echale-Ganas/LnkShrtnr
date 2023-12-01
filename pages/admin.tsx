import React from "react";
import Container from "./templates/container";
import Navigation from "./templates/navigation";

function Admin() {
    return <Container title="Admin">
        <Navigation currentPage="admin"></Navigation>
    </Container>;
}

export default Admin;