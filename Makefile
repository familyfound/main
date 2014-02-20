
PAGES = $(patsubst %.jsx, %.js, $(wildcard client/pages/*.jsx))
COMPONENTS = $(patsubst %.jsx, %.js, $(wildcard client/components/*.jsx))
COMPILED = $(PAGES) $(COMPONENTS)
LESS = $(wildcard less/*.less)

build: components index.js main.css $(COMPILED)
	@component build --dev -n build -s main -o web

client/pages/%.js: client/pages/%.jsx
	@jsx $< > $@

client/components/%.js: client/components/%.jsx
	@jsx $< > $@

main.css: ${LESS}
	lessc less/index.less main.css

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

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

web/bootstrap-3.1.0:
	@cd web &&\
	    wget https://github.com/twbs/bootstrap/releases/download/v3.1.0/bootstrap-3.1.0-dist.zip &&\
	    unzip bootstrap-3.1.0-dist.zip &&\
	    mv dist bootstrap-3.1.0 &&\
	    rm bootstrap-3.1.0-dist.zip

web/font-awesome-4.0.3:
	@cd web &&\
	    wget http://fontawesome.io/assets/font-awesome-4.0.3.zip &&\
	    unzip font-awesome-4.0.3.zip &&\
	    rm font-awesome-4.0.3.zip

web/jquery-2.0.3.js:
	@cd web && wget http://code.jquery.com/jquery-2.0.3.js

web/react-0.8.0.js:
	@cd web && wget http://fb.me/react-0.8.0.js

serve: web/jquery-2.0.3.js web/react-0.8.0.js web/bootstrap-3.1.0 web/font-awesome-4.0.3
	@node index.js

.PHONY: clean
