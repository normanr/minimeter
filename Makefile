.DEFAULT: dist
.PHONY: dist distclean

dist:	Minimeter-fx.xpi

clean:
	rm -rf dist

distclean: clean
	rm -f Minimeter-fx.xpi

chrome_files = $(shell cd chrome && find * -type f -not -name .*.swp)
other_files = install.js install.rdf license.txt $(shell find defaults -type f)

Minimeter-fx.xpi: dist/chrome/minimeter.jar dist/chrome.manifest $(addprefix dist/,$(other_files))
	@echo zip -qr9 $@ dist
	@cd dist && zip -qr9 ../$@ *

dist/%: %
	@-mkdir -p $(@D)
	cp -a $< $@

dist/chrome.manifest:
	sed 's#\bchrome/#jar:chrome/minimeter.jar!/#' chrome.manifest > dist/chrome.manifest

dist/chrome:
	mkdir -p $@

dist/chrome/minimeter.jar: dist/chrome $(addprefix chrome/,$(chrome_files))
	@echo zip -qr0 $@ chrome
	@cd chrome && zip -q0 ../$@ $(chrome_files)

