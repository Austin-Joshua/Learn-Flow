import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { UserAvatar, resolveAvatarGender } from '../components/common/UserAvatar';
import { User } from '../types';

describe('UserAvatar & Character Gender Resolution', () => {
  it('resolves female for Ada Lovelace / Learner persona', () => {
    const adaUser: User = {
      id: '1',
      email: 'learner@learnflow.edu',
      first_name: 'Ada',
      last_name: 'Lovelace',
      full_name: 'Ada Lovelace',
      is_active: true,
      roles: [{ id: 1, name: 'Learner' }],
    };
    expect(resolveAvatarGender(adaUser)).toBe('female');
  });

  it('resolves male for Alan Turing / Admin persona', () => {
    const alanUser: User = {
      id: '2',
      email: 'admin@learnflow.edu',
      first_name: 'Alan',
      last_name: 'Turing',
      full_name: 'Alan Turing',
      is_active: true,
      roles: [{ id: 4, name: 'Admin' }],
    };
    expect(resolveAvatarGender(alanUser)).toBe('male');
  });

  it('resolves male for Linus Torvalds / Instructor persona', () => {
    const linusUser: User = {
      id: '3',
      email: 'instructor@learnflow.edu',
      first_name: 'Linus',
      last_name: 'Torvalds',
      full_name: 'Linus Torvalds',
      is_active: true,
      roles: [{ id: 2, name: 'Instructor' }],
    };
    expect(resolveAvatarGender(linusUser)).toBe('male');
  });

  it('renders SVG graphic avatar with status indicator', () => {
    const { container } = render(
      <UserAvatar
        user={{
          id: '1',
          email: 'learner@learnflow.edu',
          first_name: 'Ada',
          last_name: 'Lovelace',
          full_name: 'Ada Lovelace',
          is_active: true,
          roles: [],
        }}
        size="md"
        showStatus={true}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 100 100');

    // Status dot exists
    const statusDot = container.querySelector('span.rounded-full');
    expect(statusDot).toBeTruthy();
  });
});
