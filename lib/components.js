import ko from "knockout";

// about
import abouttpl from './app/components/about/about.html!text';
// navbar
import navbartpl from './app/components/navbar/navbar.html!text';
import NavBarVm from './app/components/navbar/navbar';
// initUI
import inituitpl from './app/components/initui/initui.html!text';
import InitUIVm from './app/components/initui/initui';
// contacts bar
import contactsbartpl from './app/components/contacts-bar/contacts-bar.html!text';
import ContactsBarVm from './app/components/contacts-bar/contacts-bar';
// create account
import createaccountpl from './app/components/create-account/createaccount.html!text';
import CreateAccountVm from './app/components/create-account/createaccount';


var Components = {

    load: function() {
        //debugger;

        return new Promise((resolve, reject) => {
            ko.components.register(
                'navbar',
                {
                    viewModel: NavBarVm,
                    template: navbartpl
                }
            );

            ko.components.register('initui',
                {
                    viewModel: InitUIVm,
                    template: inituitpl
                }
            );

            ko.components.register('about', {
                template: abouttpl
            });

            ko.components.register('contacts-bar',
                {
                    viewModel: ContactsBarVm,
                    template: contactsbartpl
                }
            );

            ko.components.register('create-account',
                {
                    viewModel: CreateAccountVm,
                    template: createaccountpl
                }
            );

            resolve();
        });
    }
}


export default Components;