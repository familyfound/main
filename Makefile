
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
	jshint *.js lib test

test-only:
	mocha -R spec

gh-pages: build
	cp -r web w
	git co gh-pages
	rm -rf bootstrap font-awesome
	mv w/* ./
	rmdir w

web/jquery-2.0.3.js:
	@cd web && wget http://code.jquery.com/jquery-2.0.3.js

web/react-0.8.0.js:
	@cd web && wget http://fb.me/react-0.8.0.js

serve: web/jquery-2.0.3.js web/react-0.8.0.js
	@node index.js

.PHONY: clean
