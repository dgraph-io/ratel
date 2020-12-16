export const getSpace = tablet =>
    tablet ? tablet.space || tablet.onDiskBytes : null;
