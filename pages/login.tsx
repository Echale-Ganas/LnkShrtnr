import React from "react";
import FullContainer from "./templates/fullContainer";
import PageContainer from "./templates/pageContainer";

function Login() {
    return <FullContainer title="Login">
        <PageContainer>
            <form action="/login" method="POST">
                <input id="username" name="username" placeholder="Username" type="text"/>
                <input id="password" name="password" placeholder="Password" type="password"/>
                <input type="submit" id="submit" value="Submit"/>
            </form>
        </PageContainer>
    </FullContainer>;
}

export default Login;