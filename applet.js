const Applet = imports.ui.applet;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const Calendar = imports.ui.calendar;
const UPowerGlib = imports.gi.UPowerGlib;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const Cinnamon = imports.gi.Cinnamon;
const DBus = imports.dbus;


const INHIBIT_TT = "Currently preventing screensaver";
const ALLOW_TT = "Currently allowing screensaver";

const SessionIface = {
    name: "org.gnome.SessionManager",
    methods: [ 
    { name: "Inhibit", inSignature: "susu", outSignature: "u" },
    { name: "Uninhibit", inSignature: "u", outSignature: "" }
    ]
};

let SessionProxy = DBus.makeProxyClass(SessionIface);

disp_state = 0; // inhibit off initially

function MyApplet(orientation) {
    this._init(orientation);
}


MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation) {        
        Applet.TextIconApplet.prototype._init.call(this, orientation);
        
        try {                 
            this.set_applet_icon_symbolic_name('video-display-symbolic');
            this.set_applet_tooltip(ALLOW_TT);
            this._orientation = orientation;
            
            this._inhibit = undefined;
            this._sessionProxy = new SessionProxy(DBus.session, 'org.gnome.SessionManager', '/org/gnome/SessionManager');
    
            this._onInhibit = function(cookie) {
                this._inhibit = cookie;
            };
            this.screen_menu_item = new Applet.MenuItem(_("Screensaver settings..."), 'system-run-symbolic',
                    Lang.bind(this, this._screen_menu));
            this._applet_context_menu.addMenuItem(this.screen_menu_item);
        }
        catch (e) {
            global.logError(e);
        }
    },

    _screen_menu: function() {
        Util.spawn(['gnome-control-center', 'screen']);
    },

    on_applet_clicked: function(event) {
        if(this._inhibit) {
            spawnCommandLineNoError("xscreensaver -nosplash");
            this._sessionProxy.UninhibitRemote(this._inhibit);
            this._inhibit = undefined;
            this.set_applet_icon_symbolic_name('video-display-symbolic');
            this.set_applet_tooltip(ALLOW_TT);
        } else {
            spawnCommandLineNoError("xscreensaver-command -exit"); // this is for xss only
            try {
                this._sessionProxy.InhibitRemote("inhibitor",
                       0, 
                       "inhibit mode",
                       9,
                       Lang.bind(this, this._onInhibit));
                this.set_applet_icon_symbolic_name('dialog-error-symbolic');
                this.set_applet_tooltip(INHIBIT_TT); 
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


function main(metadata, orientation) {  
    let myApplet = new MyApplet(orientation);
    return myApplet;      
}
