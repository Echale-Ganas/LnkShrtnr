# LnkShrtnr

This is a very simple and lightweight web app to create a personal link shortener.
Similar to some services that shall not be named, but allows you to host on your own servers
and domains and own control of all the data that passes through.

This was created using Bun as the runtime. It's shown to be quicker than Node, and you'll see best
results if you use the native SQLite driver (which we turn on by default).

If you just want to use it, the setup is quick and easy. You should encounter no problems just booting
it up and using it, however you can also customize it and fork it if you so desire.

## Quickstart

Clone the code to your server or device of choice. Take a look at `config.json`. You should change `username` and
`password`, otherwise it will be the default.