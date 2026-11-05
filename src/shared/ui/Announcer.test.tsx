import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AnnouncerProvider } from './Announcer'
import { useAnnounce } from './announcerContext'

function Trigger({ message }: { message: string }) {
  const announce = useAnnounce()
  return (
    <button type="button" onClick={() => announce(message)}>
      Announce
    </button>
  )
}

function setup(message: string) {
  render(
    <AnnouncerProvider>
      <Trigger message={message} />
    </AnnouncerProvider>,
  )
  return {
    region: screen.getByTestId('announcer'),
    click: () => userEvent.click(screen.getByRole('button', { name: 'Announce' })),
  }
}

describe('AnnouncerProvider', () => {
  it('renders an empty polite live region up front', () => {
    const { region } = setup('Hello')

    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toBeEmptyDOMElement()
  })

  it('puts the message in the live region', async () => {
    const { region, click } = setup('Removed Backpack from cart.')

    await click()

    expect(region).toHaveTextContent('Removed Backpack from cart.')
  })

  it('changes the text when the same message is announced twice, so it is read again', async () => {
    const { region, click } = setup('Removed Backpack from cart.')

    await click()
    const first = region.textContent
    await click()

    expect(region.textContent).not.toBe(first)
    expect(region).toHaveTextContent('Removed Backpack from cart.')
  })
})
