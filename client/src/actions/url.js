export const UPDATE_URL = "url/UPDATE_URL";

export function updateUrl(url) {
    return {
        type: UPDATE_URL,
        url,
    };
}
