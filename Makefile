
PAGES = $(patsubst %.jsx, %.js, $(wildcard client/pages/*.jsx))
COMPONENTS = $(patsubst %.jsx, %.js, $(wildcard client/components/*.jsx))
COMPILED = $(PAGES) $(COMPONENTS)

build: components index.js main.css $(COMPILED)
	@component build --dev -n build -s main -o web

client/pages/%.js: client/pages/%.jsx
	@jsx $< > $@

client/components/%.js: client/components/%.jsx
	@jsx $< > $@


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

serve:
	@node index.js

.PHONY: clean
