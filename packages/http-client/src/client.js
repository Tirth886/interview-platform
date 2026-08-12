import axios from "axios";
export const createHttpClient = (options) => {
    return axios.create({
        baseURL: options.baseURL,
        timeout: options.timeoutMs ?? 15000,
        headers: {
            "Content-Type": "application/json"
        }
    });
};
