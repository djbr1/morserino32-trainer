'use strict';

let log = require("loglevel");

const { M32Translations } = require('./m32protocol-i18n');

// all functions for speech synthesis

class M32CommandSpeechHandler {

    constructor(language = 'en') {
        this.speechSynth = window.speechSynthesis;
        this.language = language;
        this.voice = null;
        this.enabled = true;
        this.m32Translations = new M32Translations(this.language);
    }

    speak(text) {
        if (!this.enabled) {
            return;
        }
        console.log('speak', text);

        if (this.speechSynth.speaking) {
            log.debug("cancel previous speech synthesis");
            this.speechSynth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.voice = this.getVoice(this.language);
        this.speechSynth.speak(utterance);
    }

    getVoice(language) {
        if (this.voice != null) {
            return this.voice;
        }
        //console.log('getting voice for', language);
        var voices = this.speechSynth.getVoices();
        var voice;
        //voices.forEach(v => console.log(v));
        if (language === 'en') {
            voice = voices.find(voice => voice.voiceURI === 'Google UK English Male');
            if (!voice) {
                voice = voices.find(voice => voice.lang.startsWith(language));
            }
        } else if (language === 'de') {
            voice = voices.find(voice => voice.lang.startsWith(language) && voice.voiceURI.startsWith('Google'));
        } else {
            voice = voices.find(voice => voice.lang.startsWith(language));
        }
        //console.log('selected voice', voice);
        this.voice = voice;
        return voice;
    }

    setLanguage(language) {
        this.language = language;
    }

    // callback method for a full json object received
    handleM32Object(jsonObject) {
        log.debug('speech.handleM32Object', jsonObject);
        const keys = Object.keys(jsonObject);
        if (keys && keys.length > 0) {
            const key = keys[0];
            const value = jsonObject[key];
            switch(key) {
                case 'menu':
                    var menues = value['content'].split('/');
                    var textToSpeak = menues.map((menu) => this.m32Translations.translateMenu(menu, this.language, 'speak')).join(' ');
                    this.speak(textToSpeak);
                    break;
                case 'control':
                    this.speak(value['name'] + ' ' + value['value']);
                    break;
                /*    
                case 'activate':
                    this.speak(value['state']);
                    break;
                */
                case 'message':
                    this.speak(value['content']);
                    break;
                case 'config': {
                    // distinguish between navigation in configuration and manual request of config (returning mapped values):
                    let configName = this.m32Translations.translateConfig(value['name'], this.language, 'speak');
                    let configValue = '';
                    if (value['displayed']) {
                        configValue = this.m32Translations.translateConfig(value['displayed'], this.language, 'speak');
                    } else {
                        if (value['isMapped'] == false) {
                            configValue = value['value'];
                        } else {
                            let mappingIndex = value['value'];
                            configValue = value['mapped values'][mappingIndex];
                        }
                    }
                    this.speak(configName + ' is ' + configValue);
                    break;
                }
                case 'error':
                    this.speak(value['message']);
                    break;
                default:
                    console.log('unhandled json key', key);
            }
        } else {
            log.info('cannot handle json', jsonObject);
        }
    }    
}

module.exports = { M32CommandSpeechHandler }
