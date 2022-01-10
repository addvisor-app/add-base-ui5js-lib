
sap.ui.define([
    "../BaseController",
    "../ui/ScreenElements",
    "sap/ui/richtexteditor/RichTextEditor",
    "sap/uxap/ObjectPageLayout"
], function (Object, ScreenElements, RichTextEditor) {
    "use strict";

    let MainView = {};
    let View = {};
    return Object.extend("add.ui5js.ui.View", {

        constructor: function (params) {

            MainView = params.that;
            View = this;

            this.component = {};
            /*************************************
             * 
             * Verifica se o componente será embedded 
             * ou navegará para uma segunda tela
             * 
             *************************************/
            if (MainView.sectionsItems && MainView.sectionsItems.foreignKeys)
                this.component = MainView.sectionsItems.foreignKeys.find(e => e.parent === MainView.IDAPP && (e.embedded || e.embedded === undefined))

            MainView.getView().byId(MainView.IDAPP).setBusy(true);

            /*************************************
             * 
             * Principal componente container para os objetos 
             * de tela.
             * 
             *************************************/
            this.mainContent = new sap.ui.layout.form.SimpleForm({
                width: '70%',
                editable: true,
                layout: "ColumnLayout",
                columnsM: 2,
                columnsL: 2,
                columnsXL: 2
            });
            /*************************************
             * 
             * Outros tipos de componentes de tela não compatíveis
             * com SimpleForm
             * 
             *************************************/
            this.otherContent = new sap.m.Panel();

            this.setId(params.id);
            if (!this.delete)
                this.delete = params.delete;

            if (!this.save)
                this.save = params.save;

            /*************************************
             * 
             * Preparação tela UI5
             * 
             *************************************/
            this.activeButton = new sap.m.SegmentedButton({
                selectedKey: params.ACTIVE,
                //type: sap.m.ButtonType.Transparent,
                //width: "100px",
                items: [
                    new sap.m.SegmentedButtonItem({ text: "{i18n>active}" || "Ativo", key: true }),
                    new sap.m.SegmentedButtonItem({ text: "{i18n>deactivate}" || "Desativado", key: false })
                ],
                selectionChange: function (oEvent) {

                    let values = MainView.getView().getModel(MainView.IDAPP + "PARAM").getData();

                    let selectValue = (oEvent.getParameter("item").getKey() === "false") ? false : true;

                    let inpConf = new sap.m.Input();

                    MainView.dialogActive = new sap.m.Dialog({

                        contentWidth: "35%",

                        title: "{i18n>statusConfirm}",

                        content: [new sap.m.Panel({
                            content: [
                                new sap.m.Label({
                                    text: "{i18n>write} '" + values[MainView.titleField] + "' {i18n>toConfirm}"
                                }),
                                inpConf]
                        })],

                        beginButton: new sap.m.Button({

                            text: "{i18n>confirm}",

                            press: async function () {

                                if (inpConf.getValue() != values[MainView.titleField]) return;

                                values["ACTIVE"] = selectValue;

                                MainView.dialogActive.close();
                                MainView.dialogActive.destroy();
                                MainView.save();
                            }
                        }),
                        endButton: new sap.m.Button({
                            text: "{i18n>cancel}",
                            press: function (e) {

                                MainView.getView().byId(MainView.IDAPP).setBusy(false);

                                //   setTimeout(
                                //     function () {
                                var items = MainView.View.activeButton.getItems().map(function (itm) { return itm.getId() });
                                MainView.View.activeButton.setSelectedItem(items[(values["ACTIVE"]) ? 0 : 1]);
                                MainView.View.activeButton.setSelectedKey(values["ACTIVE"])
                                //  }, 1000);

                                MainView.dialogActive.close();
                                MainView.dialogActive.destroy();
                            }
                        })
                    })

                    MainView.getView().addContent(MainView.dialogActive);

                    MainView.dialogActive.open();

                }
            });

            let buttons = [];

            if (MainView.edit === true || MainView.edit === undefined) {
                buttons = [
                    new sap.m.Button({
                        icon: "sap-icon://delete",
                        text: "{i18n>delete}",
                        type: sap.m.ButtonType.Transparent,//type: "Reject",
                        press: () => {
                            this.delete(this.getId());
                        }
                    }),
                    this.activeButton,
                    new sap.m.Button({
                        icon: "sap-icon://save",
                        type: sap.m.ButtonType.Transparent,
                        text: "{i18n>save}",
                        press: async (oEvent) => {
                            await this.save(params);
                        }
                    })
                ];
            }

            let sections = [];

            if (this.component && (this.component.embedded === undefined || this.component.embedded === true))
                /*************************************
                 * 
                 * se for um componente embedded, considerar aba
                 * 
                 *************************************/
                sections[0] = new sap.uxap.ObjectPageSection({
                    showTitle: false,
                    title: "{i18n>basicData}",
                    subSections: new sap.uxap.ObjectPageSubSection({
                        mode: sap.uxap.ObjectPageSubSectionMode.Expanded,
                        validateFieldGroup: () => { },
                        blocks: new sap.m.Panel({
                            content: [this.mainContent, this.otherContent]
                        })
                        // moreBlocks: new sap.m.Label({ text: "Anbother block" })
                    })
                })


            if (MainView.sectionsItems) {
                /************************************************
                   Possibilita incluir mais seções a partir do controller.
                   Type: sap.uxap.ObjectPageSection
                   Esse parametro tem prioridade
                 ***********************************************/
                sections = sections.concat(MainView.sectionsItems.items);
            }

            this.title = new sap.m.Label({
                text: params[MainView.titleField] || MainView.titleField || null
            });

            this.avatar = new sap.m.Avatar({
                src: params.LOGO || params.ICON || MainView.icon || params.imageURI,
                displaySize: sap.m.AvatarSize.XS,
                tooltip: MainView.IDAPP + " / " + MainView.collection + " ID: " + params.id
            });

            this.Bar = new sap.m.Bar({
                contentLeft: [MainView.btBack, this.avatar, this.title],
                contentMiddle: [],
                contentRight: buttons
            })

            this.Page = new sap.uxap.ObjectPageLayout({
                useIconTabBar: true,
                isChildPage: false,
                busyIndicatorDelay: 300,
                showTitleInHeaderContent: false,
                alwaysShowContentHeader: false,
                showFooter: true,
                headerTitle: null,
                headerContent: [this.Bar],
                sections: sections
            });

            new ScreenElements(MainView).set(MainView.context, View).then(() => {
                View.Page.setBusy(false);
                MainView.getView().byId(MainView.IDAPP).setBusy(false);
            });

            return this;
        },

        setId(Id) {
            this.id = Id;
        },

        getId() {
            return this.id;
        },

        setModel(oModel, nameModel) {

            MainView.getView().setModel(oModel, nameModel);
        },

        addContent(content) {

            if (content instanceof Array) {
                this.mainContent = this.mainContent.concat(content);
            } else {
                this.mainContent.addContent(content);
            }

        },

        addOtherContent(content) {

            if (content instanceof Array) {
                this.otherContent = this.otherContent.concat(content);
            } else {
                this.otherContent.addContent(content);
            }

        },

        setHeaderData: function (data) {

            this.Page.getObjectPageHeader().setObjectTitle(data.header)
        }
    })

});