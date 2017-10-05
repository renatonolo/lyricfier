import {TranslatersLyrics} from './plugins/TranslatersLyrics';
import {TranslateVagalume} from "./plugins/TranslateVagalume";

import {NormalizeTitles} from "./NormalizeTitles";
const request = require('request').defaults({timeout: 5000});

const async = require('async');
const plugins = [TranslateVagalume];

interface Result {
    sourceName: string;
    sourceUrl: string;
    translated: [{
        lang: string,
        lyrics: string
    }];
}

export class Translaters {

    protected plugins:TranslatersLyrics[];
    protected normalizer : NormalizeTitles;

    constructor() {
        this.normalizer = new NormalizeTitles();
        this.loadPlugins();
    }

    loadPlugins() {
        this.plugins = plugins.map(Plugin => new Plugin(request));
    }

    translate(title:string, artist:string, cb : (error : any, result : Result) => void){
        const from:Result = {sourceName: '', sourceUrl: '', translated: null};
        const normalizedTitle = this.normalizer.normalize(title);

        const tasks = this.plugins.map((plugin : TranslatersLyrics) => {
            return (callback) => {
                console.log('Translating with', plugin, 'normalizedTitle', normalizedTitle, 'artist', artist);
                plugin.search(normalizedTitle, artist, (err, result) => {
                    console.warn('Result with', plugin, 'normalizedTitle', normalizedTitle, 'artist', artist, 'err', err, 'result', result);
                    if (err) {
                        return callback(err);
                    }
                    from.translated = result.translated;
                    from.sourceName = plugin.name;
                    from.sourceUrl = result.url;
                    callback(null, from);
                })
            }
        });
        async.parallel(async.reflectAll(tasks), (err, results) => {
            const result = results.find(x => !x.error);
            if (result) {
                cb(null, result.value);
            } else {
                cb(err, null);
            }
        });
    }
}
