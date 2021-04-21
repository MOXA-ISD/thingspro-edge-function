import * as https from 'https';
import fetch from 'node-fetch';


export class requests {
    private httpsAgent

    constructor() {
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });
    }

    public async get(url: string, token: string) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'mx-api-token': token
            },
            agent: this.httpsAgent
        });

        if (!response.ok) throw new Error(`unexpected response ${response.statusText}`); 
        return await response.text();
    }

    public async getStream(url: string, token: string) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'mx-api-token': token
            },
            agent: this.httpsAgent
        });

        if (!response.ok) throw new Error(`unexpected response ${response.statusText}`); 
        const reader = response.body
        let value;
        do {
            value = await reader.read();
            console.log(value)
        } while(value);
    }

    public async patch(url: string, body: string, token: string) {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'mx-api-token': token
            },
            agent: this.httpsAgent
        });
        return await response.text();
    }

    public async post(url: string, body: string, token: string) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'mx-api-token': token
            },
            agent: this.httpsAgent
        });
        return await response.text();
    }

    public async delete(url: string, token: string) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'mx-api-token': token
            },
            agent: this.httpsAgent
        });
        return await response.text();
    }
}