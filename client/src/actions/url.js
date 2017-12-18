export const UPDATE_URL = "url/UPDATE_URL";

export function updateUrl(url) {
    if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
    }

    return {
        type: UPDATE_URL,
        url
    };
}
