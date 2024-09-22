import z from 'zod';
import type {
  ProcedureType,
  QueryProcedure,
} from '../unstable-core-do-not-import/procedure';
import type {
  MaybePromise,
  Overwrite,
  Simplify,
} from '../unstable-core-do-not-import/types';
import type { UnsetMarker } from '../unstable-core-do-not-import/utils';
import type { DefaultValue, MiddlewareOptions } from './middleware';
import { createMiddlewareBuilder } from './middleware';

interface ProcedureResolverOptions<TOptions extends MiddlewareOptions> {
  ctx: Simplify<Overwrite<TOptions['ctx'], TOptions['ctx_overrides']>>;
  input: TOptions['input_out'] extends UnsetMarker
    ? undefined
    : TOptions['input_out'];
}

type ProcedureResolver<TOptions extends MiddlewareOptions, $Output> = (
  opts: ProcedureResolverOptions<TOptions>,
) => MaybePromise<
  // If an output parser is defined, we need to return what the parser expects, otherwise we return the inferred type
  DefaultValue<TOptions['output_in'], $Output>
>;

declare module './middleware' {
  interface MiddlewareFunctionOptions<TOptions extends MiddlewareOptions> {
    /**
     * The path of the procedure that is being called
     */
    path: string;
    type: ProcedureType;
  }

  interface MiddlewareBuilder<TOptions extends MiddlewareOptions> {
    query: <$Output>(
      fn: ProcedureResolver<TOptions, $Output>,
    ) => QueryProcedure<{
      input: TOptions['input_in'];
      output: $Output;
    }>;
  }
}

test('extended options', () => {
  const mw = createMiddlewareBuilder<{
    ctx: object;
    meta: object;
  }>({
    builder: null as any,
  });

  mw.use((opts) => {
    expectTypeOf(opts.path).toBeString();
    expectTypeOf(opts.type).toEqualTypeOf<ProcedureType>();
    return opts.next();
  });
});

test('extended fns', () => {
  const mw = createMiddlewareBuilder<{
    ctx: object;
    meta: object;
  }>({
    builder: (builder) => ({
      query: (fn) => {
        builder._def;
        return null as any;
      },
    }),
  });

  const res = mw.input(z.string()).query((opts) => {
    return opts.input;
  });

  expectTypeOf(res).not.toBeAny();
  expectTypeOf(res).toEqualTypeOf<
    QueryProcedure<{
      input: string;
      output: string;
    }>
  >();
});