const Generator = require('yeoman-generator');
const axios = require('axios');
const path = require('path');
const CertificateCreator = require('../lib/certificate-creator');

module.exports = class extends Generator {
    prompting() {
        return this.prompt([
            {
                type: 'list',
                name: 'java_ext_app_tpl',
                message: 'Which template do you want to start with',
                choices: ['Pizza Demo Extension App & Bot']
            }
        ]).then((answers) => {
            answers.application_name = this.options.initPrompts.application_name;
            answers.subdomain = this.options.initPrompts.subdomain;
            answers.sessionAuthSuffix = this.options.initPrompts.sessionAuthSuffix;
            answers.keyAuthSuffix = this.options.initPrompts.keyAuthSuffix;
            answers.dirname = this.options.initPrompts.dirname;
            answers.botusername = this.options.initPrompts.botusername;
            answers.botemail = this.options.initPrompts.botemail;
            answers.encryption = this.options.initPrompts.encryption;
            let log_text = ('* Generating ' +
                this.options.initPrompts.application_type.italic +
                ' ' +
                this.options.initPrompts.application_lang.italic +
                ' code from ' +
                answers.java_ext_app_tpl.italic + ' template...').bold;
            console.log(log_text.bgRed.white);

            if (answers.encryption.startsWith('RSA')) {
                answers.authType = 'rsa';
                answers.botCertPath = '';
                answers.botCertName = '';
                answers.botCertPassword = '';
                answers.botRSAPath = 'rsa/';
                answers.botRSAName = 'rsa-private-' + answers.botusername + '.pem';
            } else if (answers.encryption === 'Self Signed Certificate') {
                answers.authType = 'cert';
                answers.botCertPath = 'certificates/';
                answers.botCertName = answers.botusername;
                answers.botCertPassword = 'changeit';
                answers.botRSAPath = '';
                answers.botRSAName = '';
            } else {
                answers.authType = 'cert';
                answers.botCertPath = '';
                answers.botCertName = '';
                answers.botCertPassword = '';
                answers.botRSAPath = '';
                answers.botRSAName = '';
            }

            let mavenSearchUrlRoot = 'https://search.maven.org/solrsearch/select?q=g:com.symphony.platformsolutions+AND+a:';

            (async () => {
                this.log('Looking for latest version of Java client library..');
                const javaClientLibResponse = await axios.get(mavenSearchUrlRoot + 'symphony-api-client-java');
                answers.java_client_library_version = javaClientLibResponse.data['response']['docs'][0]['latestVersion'];
                this.log('Latest version of Java client library is', answers.java_client_library_version);

                if (answers.java_ext_app_tpl === 'Pizza Demo Extension App & Bot') {
                    this.fs.copyTpl(
                        this.templatePath('java/pizza-demo/pom.xml'),
                        this.destinationPath('pom.xml'),
                        answers
                    );
                    this.fs.copy(
                        this.templatePath('java/pizza-demo/src'),
                        this.destinationPath('src')
                    );
                    this.fs.copyTpl(
                        this.templatePath('java/pizza-demo/config.json'),
                        this.destinationPath('src/main/resources/config.json'),
                        answers
                    );
                    this.fs.copy(
                        this.templatePath(path.join(__dirname, '..', 'common-template/truststore/all_symphony_certs_truststore')),
                        this.destinationPath('certificates/all_symphony_certs_truststore'),
                        answers
                    );
                }
                /* Install certificate */
                console.log('generating from template ' + answers.java_ext_app_tpl);
                CertificateCreator.create(this.options.initPrompts.encryption, answers.botusername, answers.botemail);

                if (answers.encryption.startsWith('RSA')) {
                  console.log('reached rsa')
                  const mainClass = 'PizzaExtensionBot'
                  this.fs.copy(
                    this.templatePath(`java/pizza-demo/main-class-rsa/${mainClass}.java`),
                    this.destinationPath(`src/main/java/com/symphony/platformsolutions/pizza/${mainClass}.java`)
                  );
                }

                let log_text_completion = ('* BOT generated successfully!!').bold;
                console.log(log_text_completion.bgGreen.white);
            })();
        });
    }
};
