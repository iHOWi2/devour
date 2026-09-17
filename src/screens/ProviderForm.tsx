import React from 'react';
import {View} from 'react-native';

import {useI18n} from '../i18n';
import type {MessageKey} from '../i18n';
import {TextField} from '../ui/TextField';

type Props = {
  baseUrl: string;
  model: string;
  apiKey: string;
  hasApiKey: boolean;
  invalidField: MessageKey | null;
  onChangeBaseUrl: (value: string) => void;
  onChangeModel: (value: string) => void;
  onChangeApiKey: (value: string) => void;
};

/**
 * Three machine values: where the model lives, which model, and the key that opens it.
 *
 * The key field is never pre-filled with the stored key - it cannot be, because the stored
 * key is only decrypted when a request needs it. An empty field therefore means "keep what
 * is stored", which the hint says out loud.
 */
export function ProviderForm({
  baseUrl,
  model,
  apiKey,
  hasApiKey,
  invalidField,
  onChangeBaseUrl,
  onChangeModel,
  onChangeApiKey,
}: Props) {
  const {t} = useI18n();

  return (
    <View>
      <TextField
        invalid={invalidField === 'provider.invalid.baseUrl'}
        keyboardType="url"
        label={t('provider.baseUrl')}
        onChangeText={onChangeBaseUrl}
        placeholder={t('provider.baseUrl.example')}
        testID="provider-base-url"
        value={baseUrl}
      />
      <TextField
        invalid={invalidField === 'provider.invalid.model'}
        label={t('provider.model')}
        onChangeText={onChangeModel}
        placeholder={t('provider.model.example')}
        testID="provider-model"
        value={model}
      />
      <TextField
        hint={
          hasApiKey ? t('provider.apiKey.keep') : t('provider.apiKey.absent')
        }
        label={t('provider.apiKey')}
        onChangeText={onChangeApiKey}
        placeholder={
          hasApiKey ? t('provider.apiKey.stored') : t('provider.apiKey.absent')
        }
        secure
        testID="provider-api-key"
        value={apiKey}
      />
    </View>
  );
}
