import { Grommet } from 'grommet';
const theme = {
    global: {
      font: {
        family: "Roboto",
        size: "18px",
        height: "20px",
      },
    },
  };
  
function PageContainer({children}) {
    return(
        <html lang="en">
        <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
        </head>
        <body>
        <Grommet full theme={theme}>
        {children}
        </Grommet>
        </body>

        </html>
    )
}

export default PageContainer