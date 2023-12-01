import React from "react";
import Container from "./templates/container";

function Login() {
    return <Container title="Login">
        <form action="/login" method="POST">
            <input id="username" name="username" placeholder="Username" type="text"/>
            <input id="password" name="password" placeholder="Password" type="password"/>
            <input type="submit" id="submit" value="Submit"/>
        </form>
    </Container>;
}

export default Login;