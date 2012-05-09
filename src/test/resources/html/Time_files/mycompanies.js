var MyCompanies = Class.create(Menu, {
    _autoCompleter: null,
    _cancelReload: false,
    initialize: function($super, id, options) {
        if (global.companies) {
            $super(id, options);
        }
    },
    show: function($super, element) {
        /// <summary>Show the menu, if necessary</summary>
        var companies = new Element("div", { "id": "myCompanies_menu" });
        var container = new Element("div", { "class": "myCompanies_container" });
        container.insert(companies);
        $super(element);
        this.changeTitle(global.getLabel("myCompanies"));
        this.changeContent(container);
        this._createAutoCompleter();
        this.initializing = true;
        var gcc = getURLParam("gcc");
        var lcc = getURLParam("lcc");
        this.cancelReload = true;               // make sure the page doesn't reload because we are changing the value in code
        if (!Object.isEmpty(gcc) && !Object.isEmpty(lcc)) {
            this._autoCompleter.setDefaultValue(gcc + "|" + lcc, false, false);
        } else {
            if (!Object.isEmpty(global.usettingsJson.EWS.o_def_comp)) {
                var firstGcc = global.usettingsJson.EWS.o_def_comp['@yygcc'];
                var firstLcc = global.usettingsJson.EWS.o_def_comp['@yylcc'];
            }
            else {
                var firstGcc = global.companies.values().first().gcc;
                var firstLcc = global.companies.values().first().lcc;
            }
            this._autoCompleter.setDefaultValue(firstGcc + "|" + firstLcc, false, false);
        }
    },
    _createAutoCompleter: function() {
        /// <summary>Create the autoCompleter and add the possible values</summary>
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        global.companies.each(function(company) {
            json.autocompleter.object.push({
                data: company.value.gcc + "|" + company.value.lcc,
                text: company.value.name
            })
        } .bind(this));
        this._autoCompleter = new JSONAutocompleter('myCompanies_menu', {
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            events: $H({
                onResultSelected: 'EWS:mycompanies_CompanySelected'
            })
        }, json);
        document.observe("EWS:mycompanies_CompanySelected", this._companySelected.bind(this));
    },
    _companySelected: function() {
        /// <summary>Called when a different company is selected. This will alter the url. </summary> 
        if (!this.cancelReload) {
            var values = this._autoCompleter.getValue().idAdded.split("|");
            var gcc = values[0];
            var lcc = values[1];
            var url = window.location.search;
            url = global.removeQuerystringValue(url, "gcc");
            url = global.removeQuerystringValue(url, "lcc");
            if (url.include('?')) {
                var urlQuery = url + "&gcc=" + gcc + "&lcc=" + lcc;
            }
            else {
                var urlQuery = url + "?gcc=" + gcc + "&lcc=" + lcc;
            }
            var xmlIn = "<EWS>"
					    + "<SERVICE>COMPANY_REFRESH</SERVICE>"
				    + "</EWS>";
            this.makeAJAXrequest($H({
                xml: xmlIn,
                successMethod: this._changeURL.bind(this, urlQuery)
            }));
        }
        else {
            this.cancelReload = false;
        }

    },
    _changeURL: function(url) {
        window.location.hash = '';
        window.location.search = url;
    }
});