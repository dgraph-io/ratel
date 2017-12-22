export const UPDATE_URL = "url/UPDATE_URL";

export function updateUrl(url) {
    // Add http if the scheme is not specified.
    // TODO: Sanitize url and remove query and fragment. See the server side
    // code.
    // IDEA: The check can be more robust, instead of just checking the prefix.
    if (!/^https?:\/\//i.test(url)) {
        url = "http://" + url;
    }

    return {
        type: UPDATE_URL,
        url,
    };
}
