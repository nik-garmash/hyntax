const { update, addToken } = require('../helpers')

const {
  TOKEN_SCRIPT_TAG_CONTENT,
} = require('../constants/token-types')
const {
  SCRIPT_CONTENT_FACTORY,
  CLOSE_TAG_FACTORY
} = require('../constants/tokenizer-context-factories')

const syntaxHandlers = {
  incompleteClosingTag (state, tokens, contextFactories, options) {
    return { updatedState: state, updatedTokens: tokens }
  },

  closingScriptTag (state, tokens, contextFactories, options) {
    const closeTagContext = contextFactories[CLOSE_TAG_FACTORY](
      contextFactories,
      { withinContent: 'script' }
    )

    const updatedTokens = addToken(tokens, {
      type: TOKEN_SCRIPT_TAG_CONTENT,
      content: state.accumulatedContent
    })

    const updatedState = update(state, {
      accumulatedContent: '',
      caretPosition: state.caretPosition - state.decisionBuffer.length,
      decisionBuffer: '',
      currentContext: closeTagContext
    })

    return { updatedState, updatedTokens }
  }
}

function parseSyntax (chars, syntaxHandlers, contextFactories, options) {
  const INCOMPLETE_CLOSING_TAG_PATTERN = /<\/[^>]+$/

  if (
    chars === '<' ||
    chars === '</' ||
    INCOMPLETE_CLOSING_TAG_PATTERN.test(chars)
  ) {
    return (state, tokens) => syntaxHandlers.incompleteClosingTag(
      state,
      tokens,
      contextFactories,
      options
    )
  }

  const CLOSING_SCRIPT_TAG_PATTERN = /<\/script\s*>/

  if (CLOSING_SCRIPT_TAG_PATTERN.test(chars)) {
    return (state, tokens) => syntaxHandlers.closingScriptTag(
      state,
      tokens,
      contextFactories,
      options
    )
  }
}

module.exports = function scriptTagContentContextFactory (
  contextFactories,
  options
) {
  return {
    factoryName: SCRIPT_CONTENT_FACTORY,
    parseSyntax: (chars) => parseSyntax(
      chars,
      syntaxHandlers,
      contextFactories,
      options
    )
  }
}