import { Config } from '@remotion/cli/config';

Config.overrideWebpackConfig((currentConfiguration) => {
    return {
        ...currentConfiguration,
        module: {
            ...currentConfiguration.module,
            rules: [
                ...(currentConfiguration.module?.rules?.filter((rule) => {
                    if (rule === '...') return false;
                    if (typeof rule !== 'string' && rule && 'test' in rule && rule.test?.toString().includes('.css')) return false;
                    return true;
                }) ?? []),
                {
                    test: /\.css$/i,
                    use: [
                        'style-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    config: './postcss.config.mjs',
                                },
                            },
                        },
                    ],
                },
            ],
        },
    };
});
