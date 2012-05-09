var AuthBar = Class.create(origin, {
    __isAuthor: false,
    initialize: function($super) {
        $super();
   
		if(global.usettingsJson.EWS.o_99ekm=='X'){
		   var b = $('SCM_bar');
			if (!b) return;
			if (!window['kmRoleChecked']) {
				this.getRole();
				window['kmRoleChecked'] = true;
			}
		}

    },

    buildBar: function(isAuthor) {

        var b = $('SCM_bar');
        if (!b) return;

        if (isAuthor) {

            b.addClassName('km_auth_bar_s');
																																
            if (!$('km_auth_mode') && !$('km_auth_simu')) {
                var html = '' +
                '<div style="float:left;" class="application_editSelection2"></div><span id="km_auth_mode_c"><span class="application_action_link" id="km_auth_mode">'+global.getLabel('KM_AUTH_MODE')+'</span>:<span id="km_auth_mode_label">'+global.getLabel('KM_ON')+'</span></span>' +
                '<span id="km_auth_simu_c"> | <span class="application_action_link" id="km_auth_simu">'+global.getLabel('KM_SIMULATION')+'</span>:<span id="km_auth_simu_label">'+global.getLabel('KM_OFF')+'</span></span>' +
                '';
                b.update(html);

                $('km_auth_mode').observe('click', function() {
                    var m = !global.kmAuthModeEnabled;
                    this.setAuthMode(m);
                    document.fire("EWS:kmAuthModeChanged", { 'value': m });
                } .bind(this));

                $('km_auth_simu').observe('click', function() {
                    var s = !global.kmAuthSimulationEnabled;
                    this.setSimulation(s);
                    document.fire("EWS:kmAuthSimulationChanged", { 'value': s });
                } .bind(this));
            }
        } else {
            global.kmAuthModeEnabled = false;
            b.removeClassName('km_auth_bar_s');
            b.update('');
        }

        this.setAuthMode(false);
        this.setSimulation(false);

        return true;
    },

    getRole: function() {
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
            ' <SERVICE>ECM_GET_ROLES</SERVICE>' +
            ' <OBJECT TYPE=""/>' +
            ' <DEL/><GCC/><LCC/>' +
            ' <PARAM></PARAM>' +
            '</EWS>',
            successMethod: function(json) {
                if (json.EWS.o_i_roles) {
                    var roles = objectToArray(json.EWS.o_i_roles.yglui_str_rolid_wegid);
                    for (var i = 0; i < roles.length; i++) {
                        var rid = roles[i]['@rolid'];
                        if (rid == 'AUTHOR') {
                            return this.buildBar(true);
                        }
                    }
                }
                return this.buildBar(false);
            } .bind(this)
        }));
    },

    setAuthMode: function(m) {
        var o = $('km_auth_mode_label');
        if (o) {
            o.update((m) ? global.getLabel('KM_ON') : global.getLabel('KM_OFF'));
            global.kmAuthModeEnabled = m;
            var c = $('km_auth_simu_c');
            if (c) {
                if (!m)
                    c.hide();
                else
                    c.show();
            }
        }
    },

    setSimulation: function(s) {
        var o = $('km_auth_simu_label');
        if (o) {
            o.update((s) ? global.getLabel('KM_ON') : global.getLabel('KM_OFF'));
            global.kmAuthSimulationEnabled = s;
        }

    } 
});