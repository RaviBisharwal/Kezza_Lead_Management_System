let io;

module.exports = {

    init: serverIo => {

        io = serverIo;
    },

    getIo: () => {

        if (!io) {
            throw new Error(
                "Socket.io not initialized"
            );
        }

        return io;
    }
};