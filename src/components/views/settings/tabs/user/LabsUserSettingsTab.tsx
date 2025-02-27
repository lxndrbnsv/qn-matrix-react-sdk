/*
Copyright 2019 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { _t } from "../../../../../languageHandler";
import SettingsStore from "../../../../../settings/SettingsStore";
import LabelledToggleSwitch from "../../../elements/LabelledToggleSwitch";
import { SettingLevel } from "../../../../../settings/SettingLevel";
import { replaceableComponent } from "../../../../../utils/replaceableComponent";
import SdkConfig from "../../../../../SdkConfig";
import BetaCard from "../../../beta/BetaCard";
import SettingsFlag from '../../../elements/SettingsFlag';
import { MatrixClientPeg } from '../../../../../MatrixClientPeg';

interface ILabsSettingToggleProps {
    featureId: string;
}

export class LabsSettingToggle extends React.Component<ILabsSettingToggleProps> {
    private onChange = async (checked: boolean): Promise<void> => {
        await SettingsStore.setValue(this.props.featureId, null, SettingLevel.DEVICE, checked);
        this.forceUpdate();
    };

    public render(): JSX.Element {
        const label = SettingsStore.getDisplayName(this.props.featureId);
        const value = SettingsStore.getValue(this.props.featureId);
        const canChange = SettingsStore.canSetValue(this.props.featureId, null, SettingLevel.DEVICE);
        return <LabelledToggleSwitch value={value} label={label} onChange={this.onChange} disabled={!canChange} />;
    }
}

interface IState {
    showHiddenReadReceipts: boolean;
}

@replaceableComponent("views.settings.tabs.user.LabsUserSettingsTab")
export default class LabsUserSettingsTab extends React.Component<{}, IState> {
    constructor(props: {}) {
        super(props);

        MatrixClientPeg.get().doesServerSupportUnstableFeature("org.matrix.msc2285").then((showHiddenReadReceipts) => {
            this.setState({ showHiddenReadReceipts });
        });

        this.state = {
            showHiddenReadReceipts: false,
        };
    }

    public render(): JSX.Element {
        const features = SettingsStore.getFeatureSettingNames();
        const [labs, betas] = features.reduce((arr, f) => {
            arr[SettingsStore.getBetaInfo(f) ? 1 : 0].push(f);
            return arr;
        }, [[], []]);

        let betaSection;
        if (betas.length) {
            betaSection = <div className="mx_SettingsTab_section">
                { betas.map(f => <BetaCard key={f} featureId={f} /> ) }
            </div>;
        }

        let labsSection;
        if (SdkConfig.get()['showLabsSettings']) {
            const flags = labs.map(f => <LabsSettingToggle featureId={f} key={f} />);

            let hiddenReadReceipts;
            if (this.state.showHiddenReadReceipts) {
                hiddenReadReceipts = (
                    <SettingsFlag name="feature_hidden_read_receipts" level={SettingLevel.DEVICE} />
                );
            }

            labsSection = <div className="mx_SettingsTab_section">
                <SettingsFlag name="developerMode" level={SettingLevel.ACCOUNT} />
                { flags }
                <SettingsFlag name="enableWidgetScreenshots" level={SettingLevel.ACCOUNT} />
                <SettingsFlag name="showHiddenEventsInTimeline" level={SettingLevel.DEVICE} />
                <SettingsFlag name="lowBandwidth" level={SettingLevel.DEVICE} />
                { hiddenReadReceipts }
            </div>;
        }

        return (
            <div className="mx_SettingsTab mx_LabsUserSettingsTab">
                <div className="mx_SettingsTab_heading">{ _t("Labs") }</div>
                <div className='mx_SettingsTab_subsectionText'>
                    {
                        _t('Feeling experimental? Labs are the best way to get things early, ' +
                            'test out new features and help shape them before they actually launch. ' +
                            '<a>Learn more</a>.', {}, {
                            'a': (sub) => {
                                return <a
                                    href="https://github.com/vector-im/element-web/blob/develop/docs/labs.md"
                                    rel='noreferrer noopener'
                                    target='_blank'
                                >{ sub }</a>;
                            },
                        })
                    }
                </div>
                { betaSection }
                { labsSection }
            </div>
        );
    }
}
