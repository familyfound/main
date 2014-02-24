
PAGES = $(patsubst %.jsx, %.js, $(wildcard client/pages/*.jsx))
COMPONENTS = $(patsubst %.jsx, %.js, $(wildcard client/components/*.jsx))
COMPILED = $(PAGES) $(COMPONENTS)
LESS = $(wildcard less/*.less)

build: components index.js main.css $(COMPILED)
	@component build --dev -n build -s main -o web

example-build: components index.js main.css $(COMPILED)
	@component build --dev -n build -o test

# Resources

client/pages/%.js: client/pages/%.jsx
	@jsx $< > $@

client/components/%.js: client/components/%.jsx
	@jsx $< > $@

main.css: ${LESS}
	lessc less/index.less main.css

# Other stuff

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

# Testing

test: lint test-only

lint:
	jshint *.js lib client test

test-only:
	mocha -R spec

gh-pages: build
	cp -r web w
	git co gh-pages
	rm -rf bootstrap font-awesome
	mv w/* ./
	rmdir w

# Remote Libs

remote-libs: web/jquery-2.0.3.js web/react-0.8.0.js web/bootstrap-3.1.0 web/font-awesome-4.0.3

web/bootstrap-3.1.0:
	@cd web &&\
	    curl -O https://github.com/twbs/bootstrap/releases/download/v3.1.0/bootstrap-3.1.0-dist.zip &&\
	    unzip bootstrap-3.1.0-dist.zip &&\
	    mv dist bootstrap-3.1.0 &&\
	    rm bootstrap-3.1.0-dist.zip

web/font-awesome-4.0.3:
	@cd web &&\
	    curl -O http://fontawesome.io/assets/font-awesome-4.0.3.zip &&\
	    unzip font-awesome-4.0.3.zip &&\
	    rm font-awesome-4.0.3.zip

web/jquery-2.0.3.js:
	@cd web && curl -O http://code.jquery.com/jquery-2.0.3.js

web/react-0.8.0.js:
	@cd web && curl -O http://fb.me/react-0.8.0.js

# Heroku stuff

postinstall: remote-libs get-tools

get-tools:
	@npm install -g component less jshint react-tools

#

serve: remote-libs
	@node index.js

.PHONY: clean serve postinstall get-tools remote-libs test lint test-only build example-build
