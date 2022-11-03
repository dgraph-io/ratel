# Ratel

Dgraph Dashboard

## Building and running
See [Instructions](./INSTRUCTIONS.md).

## License

Apache 2.0. See [LICENSE](./LICENSE).

## Developing via Container

The safest way to develop and run this repository is via the Docker container. Because we will create a predictable environment using Docker images with nodeJS in the version that this app was developed. And for that you need to have VSCode installed. And then you can use the remote access feature built into VSCode in the "ms-vscode-remote.remote-containers" extension.

Follow the step by step:

1 - Install Docker locally and VSCode.
2 - Install Docker extension, and Dev Containers extension in VsCode.
3 - Run `docker-compose up` in the path of this repository.
4 - Click on "Remote Explorer" on the side of your VSCode.
5 - In the Dropdown menu choose "Containers". It will display all running and stopped containers.
6 - Right click on "rate" or "ratel-dev-1" and click on "Attach to Container". In 1 minute or less, remote access is set up.
7 - When you see "`container node:14.17.0...`" in the left part of the footer of VsCode. Open the terminal and `run npm cache clean --force` and then `npm install --legacy-peer-deps`.
8 - Finally run `npm run start`

Docker will forward the port. It will automatically run the Dashboard in your browser. And you can choose to use VSCode locally or in Container. But it's important to leave that connection open. Both Local and Remote windows in the container you can write. As long as the connection is open, writing is bound.

PS. This was tested in Windows 11. Using Docker and WSL.


## Post-mortem

PS. Update this text if(when) necessary.

We used to run Ratel along with the main Dgraph binary(Core Code). But it has been removed and some code here has become obsolete. Like the ones in the "Server" directory, some processes in Bash Script and so on. Now we have created a unique image for Ratel. See https://hub.docker.com/r/dgraph/ratel

The UI available at http://play.dgraph.io/ is kept in an S3 Bucket and distributed via CDN. Communication between the UI, documentation and parts of the Tour uses a shared dataset. Its configuration is done through the config file in `./server/play-dgraph-io.nginx.conf`.
