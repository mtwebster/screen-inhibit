const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Applet = imports.ui.applet;
const Main = imports.ui.main;
const Settings = imports.ui.settings;
const Util = imports.misc.util;
const Gettext = imports.gettext;

let SessionProxy;

if(Main.gnomeSessionProxy)
    SessionProxy = Main.gnomeSessionProxy;
else {
    let SessionIfaceString;
    let OldSessionIfaceString = '\
        <interface name="org.gnome.SessionManager">\
            <method name="Inhibit">\
                <arg type="s" direction="in"/>\
                <arg type="u" direction="in"/>\
                <arg type="s" direction="in"/>\
                <arg type="u" direction="in"/>\
                <arg type="u" direction="out"/>\
            </method>\
            <method name="Uninhibit">\
                <arg type="u" direction="in"/>\
            </method>\
       </interface>';
    try {
        eval('SessionIfaceString = '+ OldSessionIfaceString);
    } catch(e) {
        SessionIfaceString = '\
        <node>\
            ' + OldSessionIfaceString + '\
        </node>';
    }
    const SessionIface = SessionIfaceString;
    SessionProxy = Gio.DBusProxy.makeProxyWrapper(SessionIface);
}

const UUID = "screen-inhibit@mtwebster" ;
Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale");

function _(str) {
   let resultConf = Gettext.dgettext(UUID, str);
   if(resultConf != str) {
      return resultConf;
   }
   return Gettext.gettext(str);
};

function MyApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}


MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(metadata, orientation, panel_height, instance_id) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
        
        try {
            this._orientation = orientation;
            this._sessionProxy = new SessionProxy(Gio.DBus.session, 'org.gnome.SessionManager', '/org/gnome/SessionManager');
    
            this._onInhibit = function(cookie) {
                this._inhibit = cookie;
                this.stringInhibit = "" + this._inhibit;
            };
            this.screen_menu_item = new Applet.MenuItem(_("Screensaver settings..."), 'system-run-symbolic',
                    Lang.bind(this, this._screen_menu));
            this._applet_context_menu.addMenuItem(this.screen_menu_item);

            this.settings = new Settings.AppletSettings(this, UUID, instance_id);
            this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "inhibit-cookie", "stringInhibit", null, null);

            this._inhibit = undefined;
            if (this.stringInhibit == "0") {
                this.set_applet_icon_symbolic_name('video-display-symbolic');
                this.set_applet_tooltip(_("Currently allowing screensaver"));
            } else {
                this.on_applet_clicked();
            }
        }
        catch (e) {
            global.logError(e);
        }
    },

    _screen_menu: function() {
        Util.spawn(['cinnamon-settings', 'screensaver']);
    },

    on_applet_clicked: function(event) {
        if(this._inhibit) {
            spawnCommandLineNoError("xscreensaver -nosplash");
            this._sessionProxy.UninhibitRemote(this._inhibit);
            this._inhibit = undefined;
            this.stringInhibit = "0";
            this.set_applet_icon_symbolic_name('video-display-symbolic');
            this.set_applet_tooltip(_("Currently allowing screensaver"));
        } else {
            spawnCommandLineNoError("xscreensaver-command -exit"); // this is for xss only
            try {
                this._sessionProxy.InhibitRemote("inhibitor",
                       0, 
                       "inhibit mode",
                       9,
                       Lang.bind(this, this._onInhibit));
                this.set_applet_icon_symbolic_name('dialog-error-symbolic');
                this.set_applet_tooltip(_("Currently preventing screensaver"));
            } catch(e) { }
        }
    },
    
    on_orientation_changed: function (orientation) {
        this._orientation = orientation;
        this._initContextMenu();
    }
};


function spawnCommandLineNoError(command_line) {
    try {
        let [success, argv] = GLib.shell_parse_argv(command_line);
        Main.Util.trySpawn(argv);
    } catch (err) {}
}    


function main(metadata, orientation, panel_height, instance_id) {  
    let myApplet = new MyApplet(metadata, orientation, panel_height, instance_id);
    return myApplet;      
}
